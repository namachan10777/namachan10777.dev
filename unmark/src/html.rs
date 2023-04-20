use std::{collections::HashMap, fmt::Display};

#[derive(Debug, Clone)]
pub enum Html {
    Node {
        children: Vec<Html>,
        attributes: HashMap<String, String>,
        name: String,
        is_inline: bool,
        can_have_child: bool,
    },
    Text(String),
    Comment(String),
}

pub struct WriteOptions {
    pub indent: String,
}

#[derive(Clone, Copy)]
struct Context {
    indent: &'static str,
    indent_level: usize,
    attribute_wrap_threshold: usize,
}

fn write_attributes(
    f: &mut std::fmt::Formatter<'_>,
    ctx: Context,
    attributes: &HashMap<String, String>,
) -> std::fmt::Result {
    let wrap = attributes
        .iter()
        .fold(0, |acc, (key, value)| acc + key.len() + 1 + 2 + value.len())
        > ctx.attribute_wrap_threshold;
    for (key, value) in attributes {
        if wrap {
            f.write_str("\n")?;
            write_indent(
                f,
                Context {
                    indent_level: ctx.indent_level + 1,
                    ..ctx
                },
            )?;
            writeln!(f, r##"{}="{}""##, key, value)?;
        } else {
            write!(f, r##" {}="{}""##, key, value)?;
        }
    }
    Ok(())
}

fn write_indent(f: &mut std::fmt::Formatter<'_>, ctx: Context) -> std::fmt::Result {
    for _ in 0..ctx.indent_level {
        f.write_str(ctx.indent)?;
    }
    Ok(())
}

impl Display for Html {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.write(
            f,
            Context {
                indent: "  ",
                indent_level: 0,
                attribute_wrap_threshold: 80,
            },
        )
    }
}

impl Html {
    fn write(&self, f: &mut std::fmt::Formatter<'_>, ctx: Context) -> std::fmt::Result {
        match self {
            Html::Comment(comment) => {
                for line in comment.lines() {
                    write_indent(f, ctx)?;
                    f.write_fmt(format_args!("\n<!-- {} -->", line))?;
                }
            }
            Html::Text(text) => {
                for (idx, line) in text.lines().enumerate() {
                    if idx != 0 {
                        f.write_str("\n")?;
                        write_indent(f, ctx)?;
                    }
                    f.write_str(line)?;
                }
            }
            Html::Node {
                children,
                attributes,
                name,
                is_inline,
                can_have_child,
            } => match (is_inline, can_have_child) {
                (true, false) => {
                    write_indent(f, ctx)?;
                    f.write_fmt(format_args!("<{}", name))?;
                    write_attributes(f, ctx, attributes)?;
                    f.write_str("/>")?;
                }
                (true, true) => {
                    write_indent(f, ctx)?;
                    f.write_fmt(format_args!("<{}", name))?;
                    write_attributes(f, ctx, attributes)?;
                    f.write_str(">")?;
                    for child in children {
                        child.write(
                            f,
                            Context {
                                indent_level: ctx.indent_level + 1,
                                ..ctx
                            },
                        )?;
                    }
                    f.write_fmt(format_args!("</{}>", name))?;
                }
                (false, false) => {
                    write_indent(f, ctx)?;
                    f.write_fmt(format_args!("<{}", name))?;
                    write_attributes(f, ctx, attributes)?;
                    f.write_str("/>")?;
                }
                (false, true) => {
                    write_indent(f, ctx)?;
                    f.write_fmt(format_args!("<{}", name))?;
                    write_attributes(f, ctx, attributes)?;
                    f.write_str(">")?;
                    for child in children {
                        f.write_str("\n")?;
                        child.write(
                            f,
                            Context {
                                indent_level: ctx.indent_level + 1,
                                ..ctx
                            },
                        )?;
                    }
                    f.write_fmt(format_args!("\n</{}>", name))?;
                }
            },
        };
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use maplit::hashmap;

    use super::*;

    #[test]
    fn test_format_print() {
        let div = Html::Node {
            children: vec![Html::Node {
                children: vec![Html::Text("Lorem ipsum".to_owned())],
                attributes: Default::default(),
                name: "span".to_owned(),
                is_inline: true,
                can_have_child: true,
            }],
            attributes: hashmap! {"class".to_owned() => "root".to_owned()},
            name: "div".to_owned(),
            is_inline: false,
            can_have_child: true,
        };
        assert_eq!(
            div.to_string(),
            concat!(
                "<div class=\"root\">\n",
                "  <span>Lorem ipsum</span>\n",
                "</div>",
            )
        );
    }
}

macro_rules! html {
    () => {};
}
