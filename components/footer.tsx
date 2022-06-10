import { ListItem, UnorderedList, chakra } from "@chakra-ui/react";
import * as React from "react";

import { Metadata } from "../lib/generated/metadata";
import NormalLink from "./normalLink";

interface FooterProps {
  metadata: Metadata;
}

const Footer: React.FC<FooterProps> = (props) => {
  console.log(props);
  return (
    <chakra.footer>
      <chakra.h2 fontSize="xl" fontWeight="bold">
        # History
      </chakra.h2>
      <UnorderedList variant="disc" fontSize="normal">
        {props.metadata.map((meta) => (
          <ListItem key={meta.hash}>
            <NormalLink
              href={`https://github.com/namachan10777/namachan10777.dev/commit/${meta.hash}`}
            >
              <chakra.span fontFamily="mono" textDecor="underline" mr={3}>
                {meta.hash}
              </chakra.span>
            </NormalLink>
            <chakra.span mr={3}>{meta.date}</chakra.span>
            <chakra.span>{meta.msg}</chakra.span>
          </ListItem>
        ))}
      </UnorderedList>
    </chakra.footer>
  );
};

export default Footer;
