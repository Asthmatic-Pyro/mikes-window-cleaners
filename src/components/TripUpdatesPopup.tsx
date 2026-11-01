import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import TripUpdatesForm from "@/components/TripUpdatesForm";

const STORAGE_KEY = "mwc_trip_updates_popup_dismissed";

export default function TripUpdatesPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setOpen(true), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal open={open} title="Where is Mike — and when does he move?" onClose={dismiss}>
      <TripUpdatesForm idPrefix="popup-trip" onSuccess={dismiss} />
    </Modal>
  );
}
