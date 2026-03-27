import React from "react";
import {
  Card as BaseCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../react/index.js";

interface CardComponentProps {
  title?: string;
  description?: string;
  padding?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  title,
  description,
  padding = 24,
  className,
  children,
}: CardComponentProps) {
  return (
    <BaseCard className={className}>
      {(title || description) && (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent
        className={title || description ? undefined : "pt-6"}
        style={{ padding: `${padding}px` }}
      >
        {children}
      </CardContent>
    </BaseCard>
  );
}

export default Card;
