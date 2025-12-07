ALWAYS prefer interfaces when modelling inheritance.

The `&` operator has terrible performance in TypeScript. Only use it where `interface extends` is not possible.

```ts
// BAD

type A = {
  a: string;
};

type B = {
  b: string;
};

type C = A & B;
```

```ts
// GOOD

interface A {
  a: string;
}

interface B {
  b: string;
}

interface C extends A, B {
  // Additional properties can be added here
}
```
