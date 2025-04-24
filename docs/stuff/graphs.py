import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_rag_types_architecture():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim([0, 10])
    ax.set_ylim([0, 10])
    ax.axis('off')

    # 1) User Query box
    query_box = patches.Rectangle((4, 8.5), 2, 1, fill=False, linewidth=1)
    ax.add_patch(query_box)
    ax.text(5, 9, "User Query", ha="center", va="center")

    # 2) RAG Core box
    rag_core_box = patches.Rectangle((1, 6.5), 8, 1.5, fill=False, linewidth=1)
    ax.add_patch(rag_core_box)
    ax.text(5, 7.2,
            "RAG Core Cycle\n(Embed & Retrieve → Generate → (Optional) Refine)",
            ha="center", va="center")

    # Arrow from User Query to RAG Core
    ax.arrow(5, 8.5, 0, -0.5, width=0.01, length_includes_head=True, head_width=0.2)

    # 3) RAG Variants box
    variants_box = patches.Rectangle((1, 3.5), 8, 2.5, fill=False, linewidth=1)
    ax.add_patch(variants_box)
    ax.text(5, 5.5, "RAG Variants", ha="center", va="center", fontsize=11)

    # Sub-labels inside RAG Variants
    rag_types = [
        "Standard RAG",
        "Graph RAG",
        "Adaptive RAG",
        "Iterative RAG",
        "Corrective RAG",
        "RAPTOR RAG"
    ]
    # We'll lay them out in two columns
    x_left, x_right = 2, 6
    y_start = 4.7
    y_step = 0.4

    for i, rag_type in enumerate(rag_types[:3]):
        ax.text(x_left, y_start - i*y_step, f"- {rag_type}", ha="left", va="center")
    for j, rag_type in enumerate(rag_types[3:]):
        ax.text(x_right, y_start - j*y_step, f"- {rag_type}", ha="left", va="center")

    # Arrow from RAG Core to RAG Variants
    ax.arrow(5, 6.5, 0, -1, width=0.01, length_includes_head=True, head_width=0.2)

    # 4) Final Answer box
    answer_box = patches.Rectangle((4, 2), 2, 1, fill=False, linewidth=1)
    ax.add_patch(answer_box)
    ax.text(5, 2.5, "Final Answer", ha="center", va="center")

    # Arrow from RAG Variants to Final Answer
    ax.arrow(5, 3.5, 0, -1.3, width=0.01, length_includes_head=True, head_width=0.2)

    plt.title("RAG Types Architecture (Including Standard RAG)", pad=15)
    plt.show()

if __name__ == "__main__":
    draw_rag_types_architecture()
