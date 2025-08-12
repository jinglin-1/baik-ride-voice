/// <reference types="vite/client" />
import type React from "react";


declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vapi-widget": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        "assistant-id"?: string;
        "public-key"?: string;
      };
    }
  }
}
