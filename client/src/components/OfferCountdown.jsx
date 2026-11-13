import { useEffect, useRef, useState } from 'react';

function getRemainingSeconds(expiresAt) {
  const expiryTime = Date.parse(expiresAt);
  if (!Number.isFinite(expiryTime)) return null;
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
}

export default function OfferCountdown({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiresAt));
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let notified = false;
    const updateCountdown = () => {
      const seconds = getRemainingSeconds(expiresAt);
      setRemaining(seconds);
      if (seconds === 0 && !notified) {
        notified = true;
        onExpireRef.current?.();
      }
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  if (remaining === null) return <span>Expiry unavailable</span>;
  if (remaining === 0) return <span role="status">Offer expired</span>;

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  return <span>Expires in {minutes}m {seconds}s</span>;
}
