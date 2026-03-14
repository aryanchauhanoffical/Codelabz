import React from "react";
import DOMPurify from "dompurify";

// DOMPurify strips <video> by default — extend the allowed set so embedded
// video embeds from the media drawer render correctly in both the editor
// preview and the public tutorial page.
const SANITIZE_CONFIG = {
  ADD_TAGS: ["video", "source"],
  ADD_ATTR: ["controls", "src", "type", "preload", "poster", "style", "alt"]
};

const HtmlTextRenderer = ({ html = "<p>Html Text Renderer</p>" }) => {
  // used to remove any sensitive tags like <script> which might be malicious
  const sanitizedHTML = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};

export default HtmlTextRenderer;
