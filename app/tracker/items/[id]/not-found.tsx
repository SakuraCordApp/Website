import { TrackerDialog } from "../../item-dialog";
export default function ItemNotFound() {
  return (
    <TrackerDialog title="Item not found">
      <h1>Item not found</h1>
      <p>
        This tracker link may be incorrect or the item may have been removed.
      </p>
    </TrackerDialog>
  );
}
