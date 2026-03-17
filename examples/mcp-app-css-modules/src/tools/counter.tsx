import { InferSchema, type ToolMetadata } from "xmcp";
import { useState } from "react";
import { z } from "zod";
import styles from "./counter.module.css";

export const metadata: ToolMetadata = {
  name: "counter",
  description: "Counter React",
};

export const schema = {
  initialCount: z.number().describe("The initial count value"),
};

export default function handler({ initialCount }: InferSchema<typeof schema>) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.label}>Counter</div>
          <div className={styles.count}>{count}</div>
        </div>

        <div className={styles.buttonGroup}>
          <div className={styles.buttonRow}>
            <button
              onClick={() => setCount(count - 1)}
              className={styles.button}
            >
              Decrement
            </button>
            <button
              onClick={() => setCount(count + 1)}
              className={styles.button}
            >
              Increment
            </button>
          </div>
          <button onClick={() => setCount(0)} className={styles.resetButton}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
