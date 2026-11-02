import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface Barcode128Props {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  rotated?: boolean;
}

export const Barcode128: React.FC<Barcode128Props> = ({
  value,
  width = 1.2,
  height = 40,
  displayValue = true,
  fontSize = 9,
  className = '',
  rotated = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          font: 'monospace',
          fontSize,
          textMargin: 2,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Barcode rendering error:', err);
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  if (rotated) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
          <svg ref={svgRef} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg ref={svgRef} />
    </div>
  );
};
