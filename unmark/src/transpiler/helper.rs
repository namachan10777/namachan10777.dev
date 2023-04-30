#[cfg(feature = "syntax-highlight")]
use axohtml::{elements::PhrasingContent, html, text};
#[cfg(feature = "syntax-highlight")]
use once_cell::sync::Lazy;
#[cfg(feature = "syntax-highlight")]
use syntect::{
    highlighting::{FontStyle, Style, ThemeSet},
    parsing::SyntaxSet,
    util::LinesWithEndings,
};

#[cfg(feature = "syntax-highlight")]
pub static SYNTAX_SET: Lazy<SyntaxSet> = Lazy::new(SyntaxSet::load_defaults_newlines);
#[cfg(feature = "syntax-highlight")]
pub static THEME_SET: Lazy<ThemeSet> = Lazy::new(ThemeSet::load_defaults);

#[cfg(feature = "syntax-highlight")]
pub fn syntax_highlight(
    source: &str,
    theme: &syntect::highlighting::Theme,
    syntax: &syntect::parsing::SyntaxReference,
) -> Vec<super::PhrasingContent> {
    use syntect::easy::HighlightLines;
    let mut styled: Vec<super::PhrasingContent> = Vec::new();
    let mut h = HighlightLines::new(syntax, theme);
    for line in LinesWithEndings::from(source) {
        let ranges: Vec<(Style, &str)> = h.highlight_line(line, &SYNTAX_SET).unwrap();
        let mut styled_line: Vec<super::PhrasingContent> = Vec::new();
        for (style, token) in ranges {
            let italic = style.font_style.contains(FontStyle::ITALIC);
            let bold = style.font_style.contains(FontStyle::BOLD);
            let underline = style.font_style.contains(FontStyle::UNDERLINE);
            let html_style = format!(
                "color: rgba({}, {}, {}, {}); background-color: rgba({}, {}, {}, {});",
                style.foreground.r,
                style.foreground.g,
                style.foreground.b,
                style.foreground.a,
                style.background.r,
                style.background.g,
                style.background.b,
                style.background.a,
            );
            let html_style = if italic {
                format!("{html_style} font-stylet: italic;")
            } else {
                html_style
            };
            let html_style = if bold {
                format!("{html_style} font-weight: bold;")
            } else {
                html_style
            };
            let html_style = if underline {
                format!("{html_style} text-decoration: underline;")
            } else {
                html_style
            };

            let styled_token: Box<dyn PhrasingContent<String>> =
                html!(<span style=html_style>{text!(token)}</span>);
            styled_line.push(styled_token);
        }
        styled.push(html!(<span class="line">{styled_line}</span>))
    }
    styled
}
