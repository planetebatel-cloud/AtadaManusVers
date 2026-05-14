/*
 * ATADA — Home (Root Page)
 * 2-page swipe: Match (cards) ↔ Feed (list)
 * Other pages (resume, applications, pricing) are separate routes.
 */

import { SwipeLayout } from "@/components/SwipeLayout";
import { DiscoveryPage } from "./DiscoveryPage";
import { FeedPage } from "./FeedPage";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#F9F9F9]">
      <SwipeLayout initialPage={0}>
        <DiscoveryPage />
        <FeedPage />
      </SwipeLayout>
    </div>
  );
}
