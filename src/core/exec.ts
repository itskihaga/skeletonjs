import { InputElement } from "../domain/input";
import { OutputElement, RenderingOutput } from "../domain/output";
import { ResolvePostElement } from "../domain/plugin";
import { Variables, VariablesWrapper } from "../domain/variables";
import { RenderingContext } from "../domain/context";
import { resolveText } from "./text";
import { flatten } from "lodash";
import { ViewContainer } from "../domain/container";

export const exec = (
  entry: string,
  resolvers: Record<string, ResolvePostElement>,
  variables: Variables,
  container: ViewContainer
): RenderingOutput => {
  const context: RenderingContext = {
    variables: new VariablesWrapper(variables),
    container
  };
  const markup = container.getView(entry);
  return {
    contents: flatten(
      markup.map((e) => convert(e, resolvers, context))
    ),
  };
};

export const convert = (
  element: InputElement,
  resolvers: Record<string, ResolvePostElement>,
  context: RenderingContext
): OutputElement | OutputElement[] => {
  switch (element.type) {
    case "BasicElement":
      return {
        tag: element.tag,
        attrs: element.attrs,
        children: flatten(element.children?.map((e) => convert(e, resolvers, context))),
      };

    case "PostElement":
      const resolve = resolvers[element.name];
      if (resolve) {
        return resolve(
          element, context,
          (e, passedContext) => convert(e, resolvers, passedContext || context)
        );
      }
      throw new Error(`resolver '${element.name}' not found`);
    case "TextElement":
      return {
        tag: null,
        content: resolveText(element.content, context),
      };
  }
};