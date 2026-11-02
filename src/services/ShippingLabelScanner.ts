export interface ScannedShippingLabelData {
  carrier?: string;
  sender_name?: string;
  receiver_name?: string;
  receiver_address?: string;
  receiver_city?: string;
  tracking_number?: string;
  short_code?: string;
  weight_desi?: string;
}

export class ShippingLabelScanner {
  /**
   * Prompts the user to pick an image from camera or gallery and extracts shipping label data using Gemini.
   */
  async scanAndExtractFromFile(file: File): Promise<ScannedShippingLabelData | null> {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await fetch('/api/scan-shipping-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to scan shipping label from server');
      }

      const result = await res.json();
      if (result.success && result.data) {
        return result.data as ScannedShippingLabelData;
      }
      return null;
    } catch (err) {
      console.error('ShippingLabelScanner error:', err);
      return null;
    }
  }

  /**
   * Triggers file input selection (camera or gallery) and returns the extracted shipping label data.
   */
  scanAndExtract(useCamera: boolean = true): Promise<ScannedShippingLabelData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (useCamera) {
        input.capture = 'environment';
      }

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const data = await this.scanAndExtractFromFile(file);
        resolve(data);
      };

      // In case user cancels file dialog
      window.addEventListener(
        'focus',
        () => {
          setTimeout(() => {
            if (!input.files || input.files.length === 0) {
              // Dialog was dismissed without selection
              resolve(null);
            }
          }, 1500);
        },
        { once: true }
      );

      input.click();
    });
  }
}
