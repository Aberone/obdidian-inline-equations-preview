import { Plugin } from 'obsidian';
import { syntaxTree } from "@codemirror/language";
import { Extension, RangeSetBuilder, StateField, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";

export const mathStateField = StateField.define<DecorationSet>({
    create(state): DecorationSet {
        return Decoration.none;
    },

    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        let mathBegin = -1;
        let mathContentBegin = -1;
        let isBlock = false;

        syntaxTree(transaction.state).iterate({
            enter(node) {
                if (node.name.contains("formatting-math-begin")) {
                    mathBegin = node.from;
                    mathContentBegin = node.to;
                    isBlock = node.name.contains("math-block");
                } else if (mathBegin !== -1 && node.name.contains("formatting-math-end")) {
                    if (!isBlock) {
                        const mathContentEnd = node.from;
                        const mathEnd = node.to;
                        const cursor = transaction.state.selection.main.head;
                        let math = transaction.state.doc.sliceString(mathContentBegin, mathContentEnd);

                        if (mathBegin <= cursor && cursor <= mathEnd) {
                            builder.add(
                                mathEnd,
                                mathEnd,
                                Decoration.widget({
                                    widget: new WidgetType({
                                        math: math,
                                        block: true
                                    }),
                                    block: true
                                })
                            );
                        }
                    }
                    mathBegin = -1;
                    mathContentBegin = -1;
                    isBlock = false;
                }
            }
        });

        return builder.finish();
    },

    provide(field: StateField<DecorationSet>): Extension {
        return EditorView.decorations.from(field)
    }
});

export default class MyPlugin extends Plugin {
    async onload() {
        this.registerEditorExtension(mathStateField);
	}
}
