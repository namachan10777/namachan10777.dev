use axohtml::elements::{FlowContent, PhrasingContent};
use axohtml::{html, text};

use crate::highlight::highlight;
use crate::md::Ast;

pub trait Hooks {
    fn code_flow(&self, code: &str) -> Result<Box<dyn FlowContent<String>>, Error> {
        Ok(html!(<code>{text!(code)}</code>))
    }

    fn code_phrasing(&self, code: &str) -> Result<Box<dyn PhrasingContent<String>>, Error> {
        Ok(html!(<code>{text!(code)}</code>))
    }

    fn section(
        &self,
        level: u8,
        title: &[Ast],
        children: &[Ast],
    ) -> Result<Box<dyn FlowContent<String>>, Error> {
        let title = self.phrasing_contents(title)?;
        let children = self.flow_contents(children)?;
        let title: Box<dyn FlowContent<String>> = match level {
            1 => html!(<h1 class="heading">{title}</h1>),
            2 => html!(<h2 class="heading">{title}</h2>),
            3 => html!(<h3 class="heading">{title}</h3>),
            4 => html!(<h4 class="heading">{title}</h4>),
            5 => html!(<h5 class="heading">{title}</h5>),
            6 => html!(<h6 class="heading">{title}</h6>),
            _ => return Err(Error::InvalidHeadingLevel(level)),
        };
        Ok(html!(
            <section>
                {title}
                {children}
            </section>
        ))
    }

    fn phrasing_content(&self, ast: &Ast) -> Result<Box<dyn PhrasingContent<String>>, Error> {
        match ast {
            Ast::Code(code) => self.code_phrasing(code),
            Ast::Text(text) => Ok(text!(text.clone())),
            Ast::Image { url, alt } => Ok(html!(<img class="generic-img" src=url alt=alt />)),
            Ast::Link { url, contents } => {
                Ok(html!(<a href=url>{self.flow_contents(contents)?}</a>))
            }
            ast => unimplemented!("{:?}", ast),
        }
    }

    fn phrasing_contents(
        &self,
        ast: &[Ast],
    ) -> Result<Vec<Box<dyn PhrasingContent<String>>>, Error> {
        ast.iter()
            .map(|ast| self.phrasing_content(ast))
            .collect::<Result<Vec<_>, _>>()
    }

    fn flow_content(&self, ast: &Ast) -> Result<Box<dyn FlowContent<String>>, Error> {
        match ast {
            Ast::Code(code) => self.code_flow(code),
            Ast::Section {
                level,
                title,
                contents,
            } => self.section(*level, title, contents),
            Ast::Paragraph(contents) => {
                let contents = self.phrasing_contents(contents)?;
                Ok(html!(<p>{contents}</p>))
            }
            Ast::Link { url, contents } => {
                Ok(html!(<a href=url>{self.flow_contents(contents)?}</a>))
            }
            Ast::UnorderedList(items) => Ok(html!(
                <ul>
                    {items.iter().map(|item| Ok(html!(<li>{self.flow_contents(item)?}</li>))).collect::<Result<Vec<_>, _>>()?}
                </ul>
            )),
            Ast::Text(text) => Ok(text!(text.clone())),
            Ast::CodeBlock { info, content } => {
                let highlighted = highlight(info, content).unwrap();
                Ok(html!(
                    <pre class="code-block">
                        <code>{highlighted}</code>
                    </pre>
                ))
            }
            ast => unimplemented!("{:?}", ast),
        }
    }

    fn flow_contents(&self, ast: &[Ast]) -> Result<Vec<Box<dyn FlowContent<String>>>, Error> {
        ast.iter()
            .map(|ast| self.flow_content(ast))
            .collect::<Result<Vec<_>, _>>()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("invalid heading level {0}")]
    InvalidHeadingLevel(u8),
}

pub fn document<H: Hooks>(
    hooks: H,
    md: &[crate::md::Ast],
) -> Result<Vec<Box<dyn axohtml::elements::FlowContent<String>>>, Error> {
    md.iter()
        .map(|ast| hooks.flow_content(ast))
        .collect::<Result<Vec<_>, _>>()
}
