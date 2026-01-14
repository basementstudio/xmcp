"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItemProps {
  question: string;
  children: React.ReactNode;
}

export function FAQItem({ question, children }: FAQItemProps) {
  return (
    <AccordionItem value={question}>
      <AccordionTrigger>{question}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

interface FAQProps {
  children: React.ReactNode;
}

export function FAQ({ children }: FAQProps) {
  return (
    <div className="not-prose my-6">
      <Accordion type="multiple" defaultValue={[]}>
        {children}
      </Accordion>
    </div>
  );
}
