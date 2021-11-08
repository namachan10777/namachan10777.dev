import * as React from "react";
import {
  useColorMode,
  Button,
  chakra,
  useColorModeValue,
} from "@chakra-ui/react";
import NormalLink from "./normalLink";

export type HeaderProps = {
  path: string[][];
};

const Header: React.FC<HeaderProps> = ({ path }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigation = [];
  for (let i = 0; i < path.length; i++) {
    if (i !== 0) {
      navigation.push(<span key={2 * i}> / </span>);
    }
    navigation.push(
      <NormalLink key={1 + 2 * i} href={path[i][1]}>
        {path[i][0]}
      </NormalLink>
    );
  }
  const buttonBgColor = useColorModeValue("gray.800", "gray.100");
  const buttonFgColor = useColorModeValue("gray.100", "gray.800");
  return (
    <chakra.header display="flex" flexDir="row" justifyContent="space-between">
      <chakra.span>{navigation}</chakra.span>
      <Button
        onClick={toggleColorMode}
        h={7}
        fontSize="sm"
        fontWeight="normal"
        color={buttonFgColor}
        bgColor={buttonBgColor}
      >
        to {colorMode === "light" ? "Dark" : "Light"}
      </Button>
    </chakra.header>
  );
};

export default Header;
