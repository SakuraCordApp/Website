import { TrackerDialog } from "../../item-dialog";
export default function LoadingItem() {
  return (
    <TrackerDialog title="Loading item">
      <p className="community-loading" role="status">
        Loading item…
      </p>
    </TrackerDialog>
  );
}
