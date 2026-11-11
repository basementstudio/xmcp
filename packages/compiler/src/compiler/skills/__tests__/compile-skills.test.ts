import assert from "node:assert";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  compileSkills,
  MAX_SKILL_BYTES,
  MAX_SKILL_FILES,
  SkillValidationError,
} from "../compile-skills";

const SKILL_MD = `---
name: pdf-processing
description: Extract, fill, and assemble PDF documents
license: Apache-2.0
metadata:
  version: "1.0"
---

# PDF processing
`;

/** Writes files under a temporary project and compiles its src/skills. */
function compile(files: Record<string, string | Buffer>) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-skills-"));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const filePath = path.join(cwd, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, contents);
    }
    return compileSkills("src/skills", Object.keys(files), cwd);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

function assertInvalid(
  files: Record<string, string | Buffer>,
  expected: RegExp
) {
  assert.throws(
    () => compile(files),
    (error) => {
      assert.ok(error instanceof SkillValidationError);
      assert.match(error.message, expected);
      return true;
    }
  );
}

function sha256(contents: string | Buffer) {
  return `sha256:${createHash("sha256").update(contents).digest("hex")}`;
}

describe("compileSkills", () => {
  it("compiles a skill with its frontmatter and a complete file manifest", () => {
    const template = "# Invoice\n\nCustomer:\nAmount:\n";
    const [skill, ...rest] = compile({
      "src/skills/pdf-processing/templates/invoice.md": template,
      "src/skills/pdf-processing/SKILL.md": SKILL_MD,
    });

    assert.equal(rest.length, 0);
    assert.equal(skill.uri, "skill://pdf-processing/SKILL.md");
    assert.deepEqual(skill.frontmatter, {
      name: "pdf-processing",
      description: "Extract, fill, and assemble PDF documents",
      license: "Apache-2.0",
      metadata: { version: "1.0" },
    });
    assert.deepEqual(skill.files, [
      {
        uri: "skill://pdf-processing/SKILL.md",
        mimeType: "text/markdown",
        digest: sha256(SKILL_MD),
        size: Buffer.byteLength(SKILL_MD),
        text: SKILL_MD,
      },
      {
        uri: "skill://pdf-processing/templates/invoice.md",
        mimeType: "text/markdown",
        digest: sha256(template),
        size: 29,
        text: template,
      },
    ]);
  });

  it("matches the digest published by the Skills extension specification", () => {
    const [skill] = compile({
      "src/skills/pdf-processing/SKILL.md":
        "---\nname: pdf-processing\ndescription: Extract, fill, and assemble PDF documents\n---\n\n# PDF processing\n\nChoose the matching template from `templates/`.\n",
    });
    assert.deepEqual(
      skill.files.map(({ digest, size }) => ({ digest, size })),
      [
        {
          digest:
            "sha256:99b737495721155ece826d57521e2d66141ebdc1344a400487481ea2642ab19e",
          size: 151,
        },
      ]
    );
  });

  it("keeps text byte-exact and serves other content as a blob", () => {
    const multibyte = "﻿café ☕\r\n";
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0x00]);
    const [skill] = compile({
      "src/skills/pdf-processing/SKILL.md": SKILL_MD,
      "src/skills/pdf-processing/assets/logo.png": binary,
      "src/skills/pdf-processing/notes with space.txt": multibyte,
    });
    const [, logo, notes] = skill.files;

    assert.equal(logo.mimeType, "image/png");
    assert.equal(logo.text, undefined);
    assert.deepEqual(Buffer.from(logo.blob!, "base64"), binary);
    assert.equal(logo.digest, sha256(binary));
    assert.equal(logo.size, binary.byteLength);

    assert.equal(notes.uri, "skill://pdf-processing/notes%20with%20space.txt");
    assert.equal(notes.mimeType, "text/plain");
    assert.equal(notes.digest, sha256(Buffer.from(notes.text!, "utf8")));
    assert.equal(notes.size, Buffer.byteLength(multibyte));
  });

  it("sorts skills by name and returns none for an empty directory", () => {
    assert.deepEqual(compile({}), []);
    const skills = compile({
      "src/skills/zeta/SKILL.md": "---\nname: zeta\ndescription: Z\n---\n",
      "src/skills/alpha/SKILL.md": "---\nname: alpha\ndescription: A\n---\n",
    });
    assert.deepEqual(
      skills.map(({ frontmatter }) => frontmatter.name),
      ["alpha", "zeta"]
    );
  });

  it("rejects a name that does not match its directory", () => {
    assertInvalid(
      { "src/skills/pdf/SKILL.md": SKILL_MD },
      /name "pdf-processing" must equal its directory name "pdf"/
    );
  });

  it("rejects a skill directory without SKILL.md", () => {
    assertInvalid(
      { "src/skills/pdf-processing/references/FORMS.md": "# Forms\n" },
      /src\/skills\/pdf-processing has no SKILL\.md/
    );
  });

  it("rejects files outside a skill directory", () => {
    assertInvalid(
      { "src/skills/README.md": "# Skills\n" },
      /src\/skills\/README\.md is not inside a skill directory/
    );
  });

  it("rejects missing or malformed frontmatter", () => {
    assertInvalid(
      { "src/skills/pdf-processing/SKILL.md": "# PDF processing\n" },
      /must begin with YAML frontmatter/
    );
    assertInvalid(
      {
        "src/skills/pdf-processing/SKILL.md": "---\nname: [unclosed\n---\n",
      },
      /invalid YAML frontmatter/
    );
    assertInvalid(
      { "src/skills/pdf-processing/SKILL.md": "---\n- a\n- b\n---\n" },
      /frontmatter must be a YAML mapping/
    );
  });

  it("rejects names that break the Agent Skills naming rules", () => {
    for (const name of [
      "PDF",
      "-pdf",
      "pdf-",
      "pdf--tools",
      "a".repeat(65),
      // Not a valid URI authority either.
      "pdf tools",
    ]) {
      assertInvalid(
        {
          [`src/skills/${name}/SKILL.md`]: `---\nname: ${name}\ndescription: D\n---\n`,
        },
        /is not a valid skill name/
      );
    }
  });

  it("rejects a SKILL.md that starts with a byte order mark", () => {
    assertInvalid(
      { "src/skills/pdf-processing/SKILL.md": `\uFEFF${SKILL_MD}` },
      /starts with a byte order mark/
    );
  });

  it("accepts an absolute or dot-relative skills path", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-skills-"));
    try {
      const filePath = path.join(cwd, "src/skills/pdf-processing/SKILL.md");
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, SKILL_MD);
      const files = ["src/skills/pdf-processing/SKILL.md"];

      for (const skillsPath of [
        path.join(cwd, "src/skills"),
        "./src/skills/",
      ]) {
        assert.equal(compileSkills(skillsPath, files, cwd).length, 1);
      }
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("rejects a missing or overlong description", () => {
    assertInvalid(
      { "src/skills/pdf/SKILL.md": "---\nname: pdf\n---\n" },
      /must have a "description"/
    );
    assertInvalid(
      {
        "src/skills/pdf/SKILL.md": `---\nname: pdf\ndescription: ${"d".repeat(1025)}\n---\n`,
      },
      /description must be at most 1024 characters/
    );
  });

  it("rejects skills over the file count or total size limits", () => {
    const tooMany: Record<string, string> = {
      "src/skills/pdf/SKILL.md": "---\nname: pdf\ndescription: D\n---\n",
    };
    for (let index = 0; index < MAX_SKILL_FILES; index++) {
      tooMany[`src/skills/pdf/files/${index}.txt`] = "";
    }
    assertInvalid(tooMany, /has 513 files; a skill can have at most 512/);

    assertInvalid(
      {
        "src/skills/pdf/SKILL.md": "---\nname: pdf\ndescription: D\n---\n",
        "src/skills/pdf/large.bin": Buffer.alloc(MAX_SKILL_BYTES),
      },
      /a skill can be at most 16777216 bytes/
    );
  });

  it("reports every invalid skill at once", () => {
    assertInvalid(
      {
        "src/skills/one/notes.md": "",
        "src/skills/two/SKILL.md": "---\nname: other\ndescription: D\n---\n",
      },
      /one has no SKILL\.md[\s\S]*must equal its directory name "two"/
    );
  });
});
