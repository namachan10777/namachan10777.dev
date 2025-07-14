import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import IconImage from "~/assets/icon.webp?jsx";
import styles from "./index.module.css";
import { Education } from "~/components/education";
import { Work } from "~/components/work";
import { Book, Workshop } from "~/components/publication";

const tsukubaGraduateSchool = {
  name: "Systems and Information Engineering, University of Tsukuba",
  href: "https://www.cs.tsukuba.ac.jp/",
};

const tsukubaUniv = {
  name: "College of Information Science, University of Tsukuba",
  href: "https://www.cs.tsukuba.ac.jp/",
};

const nitk = {
  name: "National Insitite of Technology, Kagawa College (KOSEN)",
  href: "https://www.kagawa-nct.ac.jp/",
};

const otatebe = {
  name: "Osamu Tatebe",
  href: "https://www.hpcs.cs.tsukuba.ac.jp/~tatebe/index.html",
  position: "Prof.",
};

const dkitamura = {
  name: "Daichi Kitamura",
  href: "http://d-kitamura.net/",
  position: "Assistant Prof.",
};

export default component$(() => {
  return (
    <>
      <section class={styles.top}>
        <div class={styles.iconWrapper}>
          <IconImage />
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
          <a href="/post/page/1">Posts (ja)</a>
        </h2>
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
        <h2>Professional tranings</h2>
        <ol>
          <li>
            <Work
              start={new Date("2024-10")}
              company={{
                name: "Preferred Networks, Inc.",
                href: "https://www.preferred.jp/",
              }}
              position="Part-time engineer"
              topic="Storage system"
            />
          </li>
          <li>
            <Work
              start={new Date("2022-08")}
              company={{
                name: "ArkEdge Space Inc.",
                href: "https://arkedgespace.com",
              }}
              position="Part-time engineer"
              topic="Ground system"
            />
          </li>
          <li>
            <Work
              start={new Date("2021-09")}
              company={{
                name: "Cookpad Inc.",
                href: "https://info.cookpad.com",
              }}
              retire={new Date("2022-03")}
              position="Part-time engineer"
              topic="SRE"
            />
          </li>
        </ol>
      </section>
      <section>
        <h2>Publications</h2>
        <section>
          <h3>Workshop</h3>
          <ol>
            <li>
              <Workshop
                authors={[{ me: "中野将生" }, "建部修見"]}
                title="RustのUCXラッパーasync-ucxの性能評価 "
                year={2023}
                workshop="第192回 HPC研究会"
              />
            </li>
            <li>
              <Workshop
                authors={[{ me: "中野将生" }, "北村大地"]}
                title="ユーザーからの補助情報を用いるインタラクティブ音源分離システム"
                year={2020}
                workshop="日本音響学会春季研究発表会"
              />
            </li>
          </ol>
        </section>
        <section>
          <h3>Book</h3>
          <ol>
            <li>
              <Book
                authors={["Maxwell Flitton", "Caroline Morton"]}
                translators={["中田 秀基"]}
                comment="Reviwer"
                title="Async Rust"
                publisher="O'Reilly Japan"
                year={2025}
              />
            </li>
          </ol>
        </section>
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
