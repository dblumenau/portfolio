/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
/** A role headline: a small prefix line above a large headline line. */
export interface Template {
  id: string
  prefix: string
  headline: string
}

export const defaultTemplate: Template = {
  id: 'i-am-speaking',
  prefix: 'I AM',
  headline: 'Speaking',
}

export const templates: Template[] = [
  defaultTemplate,
  { id: 'i-am-attending', prefix: 'I AM', headline: 'Attending' },
  { id: 'i-am-exhibiting', prefix: 'I AM', headline: 'Exhibiting' },
  { id: 'i-am-moderating', prefix: 'I AM', headline: 'Moderating' },
  { id: 'i-am-pitching', prefix: 'I AM', headline: 'Pitching' },
  { id: 'i-am-investing', prefix: 'I AM', headline: 'Investing' },
  { id: 'i-am-volunteering', prefix: 'I AM', headline: 'Volunteering' },
  { id: 'we-are-a-partner', prefix: 'WE ARE', headline: 'A Partner' },
  { id: 'we-are-exhibiting', prefix: 'WE ARE', headline: 'Exhibiting' },
  { id: 'we-are-a-sponsor', prefix: 'WE ARE', headline: 'A Sponsor' },
  { id: 'we-are-attending', prefix: 'WE ARE', headline: 'Attending' },
  { id: 'we-are-hiring', prefix: 'WE ARE', headline: 'Hiring' },
  { id: 'i-am-hosting', prefix: 'I AM', headline: 'Hosting' },
]

/** The id that swaps the preset list for the document's own `customTemplate` lines. */
export const CUSTOM_TEMPLATE_ID = 'custom'

export const customTemplatePlaceholder: Template = {
  id: CUSTOM_TEMPLATE_ID,
  prefix: 'I AM',
  headline: 'Anything',
}

/** Falls back to the default template so callers never have to handle a missing id. */
export function templateById(id: string): Template {
  if (id === CUSTOM_TEMPLATE_ID) return customTemplatePlaceholder
  return templates.find((template) => template.id === id) ?? defaultTemplate
}

/**
 * The lines that actually get drawn: a preset, or the document's own two lines when the
 * custom role is selected. Empty custom fields fall back to the placeholder wording so the
 * card never renders a blank headline.
 */
export function resolveTemplate(doc: {
  templateId: string
  customTemplate: { prefix: string; headline: string }
}): Template {
  if (doc.templateId !== CUSTOM_TEMPLATE_ID) return templateById(doc.templateId)
  return {
    id: CUSTOM_TEMPLATE_ID,
    prefix: doc.customTemplate.prefix.trim() || customTemplatePlaceholder.prefix,
    headline: doc.customTemplate.headline.trim() || customTemplatePlaceholder.headline,
  }
}
