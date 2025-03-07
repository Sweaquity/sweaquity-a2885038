console.log("Processing CV for user:", userId);
console.log("CV URL:", cvUrl);
console.log("Extracted filePath:", filePath);
console.log("Final filePath for download:", filePath);

// Check if fileData exists
if (!fileData) {
  console.error("File download failed, fileData is null");
  return new Response(JSON.stringify({ error: "File download failed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
}

console.log("File successfully downloaded. File size:", fileData.size);

// Convert file to ArrayBuffer
const arrayBuffer = await fileData.arrayBuffer();
console.log("Converted file to ArrayBuffer. Size:", arrayBuffer.byteLength);

let extractedText = "";

// Check file extension
if (["doc", "docx"].includes(fileExtension || "")) {
  console.log("Attempting to extract text with docx-wasm...");
  try {
    extractedText = await readDocx(arrayBuffer);
    console.log("Extraction complete. Extracted text length:", extractedText.length);
  } catch (wasmError) {
    console.error("docx-wasm extraction failed:", wasmError);
    return new Response(JSON.stringify({ error: "docx-wasm extraction failed", details: wasmError.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
} else {
  console.error("Unsupported file type:", fileExtension);
  return new Response(JSON.stringify({ error: "Unsupported file type (Only .docx allowed)" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 400,
  });
}

console.log("Extracted text from CV (first 500 chars):", extractedText.substring(0, 500));
