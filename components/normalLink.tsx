import * as React from "react";
import Link from "next/link";
import { chakra, useColorModeValue } from "@chakra-ui/react";

export interface NormalLinkProps {
  href: string;
  fontSize?: string;
  children: React.ReactNode;
}

const NormalLink = (props: NormalLinkProps) => {
  const colorLinkUnselected = useColorModeValue("gray.700", "gray.300");
  const colorLinkSelected = useColorModeValue("black", "white");
  return (
    <Link href={props.href} passHref={true}>
      <chakra.a
        textDecor="underline"
        fontSize={props.fontSize}
        color={colorLinkUnselected}
        m={1}
        _hover={{ color: colorLinkSelected, fontWeight: "meduim" }}
      >
        {props.children}
      </chakra.a>
    </Link>
  );
};

export default NormalLink;
