/**
 * razorpay.js — Dynamic loader for Razorpay Standard Checkout script.
 * 
 * Injects https://checkout.razorpay.com/v1/checkout.js on demand
 * and returns a promise resolving to true when loaded.
 */

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
