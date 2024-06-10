import { Topics } from "./topic";
import { defineTopic } from "./topic/types";

export const topics = new Topics("topics-global");
export const menuTopicDef = defineTopic(false);
