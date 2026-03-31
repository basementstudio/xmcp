import React from "react";
import {
  useUiState,
  useUiDispatch,
} from "../../renderer/StateProvider.js";
import type { TabsProps, Action } from "../../schema/types.js";
import {
  Tabs as BaseTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../react/index.js";

interface TabsComponentProps extends TabsProps {
  actions?: Record<string, Action>;
  children?: React.ReactNode;
}

export function Tabs({
  tabs,
  stateKey,
  defaultValue,
  className,
  children,
}: TabsComponentProps) {
  const value = useUiState(stateKey);
  const dispatch = useUiDispatch();

  const currentValue = value != null ? String(value) : (defaultValue ?? tabs[0]?.value);

  const handleChange = (nextValue: string) => {
    dispatch({ type: "SET_STATE", key: stateKey, value: nextValue });
  };

  // Children from ComponentRenderer are React elements — map each to a TabsContent
  const childArray = React.Children.toArray(children);

  return (
    <BaseTabs value={currentValue} onValueChange={handleChange} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {childArray.map((child, index) => {
        const tab = tabs[index];
        if (!tab) return null;
        return (
          <TabsContent key={tab.value} value={tab.value}>
            {child}
          </TabsContent>
        );
      })}
    </BaseTabs>
  );
}

export default Tabs;
