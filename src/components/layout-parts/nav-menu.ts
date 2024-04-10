import type { SVGProps, JSXNode } from "@builder.io/qwik";
import { InNotes, InGithub, InTwitter } from "@qwikest/icons/iconoir";
import { allBlogs } from "content-collections";

export type SubNavItem = {
  title: string;
  href: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSXNode<unknown>;
  submenu?: SubNavItem[];
};

const blogSubmenu: SubNavItem[] = allBlogs
  .filter((blog) => blog.publish)
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .map((blog) => ({ title: blog.title, href: `/blog/${blog._meta.path}` }))
  .slice(0, Math.min(3, allBlogs.length));

export const navItems: NavItem[] = [
  { title: "Blog", href: "/blog", icon: InNotes, submenu: blogSubmenu },
  {
    title: "GitHub",
    href: "https://github.com/namachan10777",
    icon: InGithub,
    submenu: [
      {
        title: "namahchan10777.dev",
        href: "https://github.com/namachan10777/namachan10777.dev",
      },
      {
        title: "ekika",
        href: "https://github.com/namachan10777/ekika",
      },
    ],
  },
  {
    title: "Twitter",
    href: "https://github.com/namachan10777",
    icon: InTwitter,
  },
];
