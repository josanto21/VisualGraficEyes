"""Fuente nativa Manim. El entorno no incluye Manim: ejecutar tras instalar requisitos."""
from manim import Scene, Square, VGroup, Create, FadeIn, Text, UP, DOWN, BLUE, RIGHT
import json
import os


class VGERows(Scene):
    def construct(self):
        self.camera.background_color = "#101820"
        title = Text("¿Cuánto es 3 por 2?", font_size=38).to_edge(UP)
        data = json.loads(os.environ.get("VGE_STAGE_DATA", "{}"))
        common = data.get("layers", {}).get("common", "Tres filas de dos fichas.")
        idea = Text(common, font_size=26).to_edge(DOWN)
        if idea.width > 12:
            idea.scale_to_fit_width(12)
        badge = Text("ILUSTRACIÓN", font_size=14).to_corner(DOWN + RIGHT)
        self.add(title, idea, badge)
        # Geometría creada una vez. Cada fila conserva sus dos fichas.
        rows = VGroup(*[VGroup(*[Square(side_length=0.7, color=BLUE,
            fill_opacity=0.6) for _ in range(2)]).arrange() for _ in range(3)])
        rows.arrange(DOWN, buff=0.25)
        for row in rows:
            self.play(Create(row), run_time=0.8)
        total = Text("3 × 2 = 6", font_size=34).next_to(rows, DOWN)
        self.play(FadeIn(total), run_time=0.8)
        self.wait(1)
