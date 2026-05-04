import {
  buildDestinationsMetadata,
  DestinationsIndex,
} from "@/components/destinations-index";

export const metadata = buildDestinationsMetadata("en");

export default function DestinationsPage() {
  return <DestinationsIndex locale="en" />;
}
