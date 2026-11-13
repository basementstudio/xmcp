/** A skill file compiled into the bundle, with the content served for it. */
export interface SkillFile {
  uri: string;
  mimeType: string;
  /** `sha256:` plus 64 lowercase hex characters over the file's raw bytes. */
  digest: string;
  /** Byte length of the same raw bytes. */
  size: number;
  /** Valid UTF-8 content, served as `text`. */
  text?: string;
  /** Base64 of any other content, served as `blob`. */
  blob?: string;
}

/** A skill from the skills directory, compiled into the bundle. */
export interface SkillDefinition {
  /** URI of the skill's SKILL.md. */
  uri: string;
  /** SKILL.md YAML frontmatter rendered as JSON. */
  frontmatter: { name: string; description: string; [key: string]: unknown };
  /** Every file of the skill, SKILL.md first. */
  files: SkillFile[];
}
