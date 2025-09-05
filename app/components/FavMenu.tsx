import Link from "next/link";
import { useState } from "react";

export const FabMenu = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="fab" onMouseLeave={() => setOpen(false)}>
      {open && (
        <div className="fab__menu">
          <Link className="fab__link" href="/">
            Mopawsivity
          </Link>
          <Link className="fab__link" href="/players">
            Players
          </Link>
          <Link className="fab__link" href="/teams">
            Teams
          </Link>
        </div>
      )}
      <button className="fab__btn" onClick={() => setOpen((v) => !v)}>
        Explore
      </button>
    </div>
  );
};
