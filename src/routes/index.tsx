import { component$ } from "@qwik.dev/core";
import { Link, type DocumentHead } from "@qwik.dev/router";
import IconImage from "~/assets/icon.webp?jsx";
import styles from "./index.module.css";
import { Education } from "~/components/education";
import { Work } from "~/components/work";
import {
  tsukubaGraduateSchool,
  tsukubaUniv,
  nitk,
  otatebe,
  dkitamura,
} from "./index.data";

export default component$(() => {
  return (
    <>
      <section class={styles.top}>
        <div class={styles.iconWrapper}>
          <IconImage alt="namachan10777のアイコン画像。目のついた緑の箱がデフォルメされている。" />
        </div>
        <h1>Masaki Nakano</h1>
        <p>
          I am a master's student in Computer Science. I beglong to
          <a href="https://www.hpcs.cs.tsukuba.ac.jp">
            High-Performance Computing System (HPCS) laboratory
          </a>
          in University of Tsukuba, and mainly researching architectures to
          leverage scalability of parallel filesystem.
        </p>
      </section>
      <section>
        <h2>Skills and Interests</h2>
        <ul>
          <li>
            Distributed storage, high performance interconnects, storage I/O.
          </li>
          <li>Rust, C, Python</li>
          <li>Linux</li>
          <li>AWS: ECS, DynamoDB, Terraform, and others.</li>
          <li>Electoronic circuit design</li>
        </ul>
      </section>
      <section>
        <h2>
          Links
        </h2>
        <nav>
          <ol>
            <li>
              <Link href="/post/page/1">Posts (ja)</Link>
            </li>
            <li>
              <li><Link href="/">SSH pubkey</Link></li>
            </li>
          </ol>
        </nav>
      </section>
      <section>
        <h2>Education</h2>
        <ol>
          <li>
            <Education
              degree="Master's student"
              school={tsukubaGraduateSchool}
              advisor={otatebe}
              start={new Date("2024-04")}
              topic={"RPC over RDMA, Large parallel filesystem architecture."}
            />
          </li>
          <li>
            <Education
              degree="Bachelor of Computer Science"
              school={tsukubaUniv}
              advisor={otatebe}
              start={new Date("2020-04")}
              acquisition={new Date("2024-03")}
              topic={"Lightweight thread"}
            />
          </li>
          <li>
            <Education
              degree="Associated Degree of Engineering"
              school={nitk}
              advisor={dkitamura}
              start={new Date("2015-04")}
              acquisition={new Date("2020-03")}
              topic={"Blind audio source separation"}
            />
          </li>
        </ol>
      </section>
      <section>
        <h2>Work experience</h2>
        <ol>
          <li>
            <Work
              start={new Date("2026-04")}
              company={{
                name: "Preferred Networks, Inc.",
                href: "https://www.preferred.jp/",
              }}
              position="Storage engineer"
              topic="Storage system"
            />
          </li>
        </ol>
      </section>
    </>
  );
});

export const head: DocumentHead = {
  title: "namachan10777.dev",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
