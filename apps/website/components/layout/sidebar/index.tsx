import { getSidebarTreeFromIndex } from "../../../utils/markdown";
import { SidebarClient } from "./client";

export const Sidebar = async () => {
  const sidebar = getSidebarTreeFromIndex();

  return <SidebarClient sidebar={sidebar} />;
};
