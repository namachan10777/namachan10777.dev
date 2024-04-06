import type { SVGProps, JSXNode } from "@builder.io/qwik";
import { InNotes, InGithub, InTwitter } from "@qwikest/icons/iconoir";

export type NavItem = {
  title: string;
  href: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSXNode<unknown>;
};

export const navItems: NavItem[] = [
  { title: "Blog", href: "/blog", icon: InNotes },
  { title: "GitHub", href: "https://github.com/namachan10777", icon: InGithub },
  {
    title: "Twitter",
    href: "https://github.com/namachan10777",
    icon: InTwitter,
  },
];
