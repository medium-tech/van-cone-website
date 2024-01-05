declare module 'htmlfy' {
  export interface Config {
    strict?: boolean
    tab_size?: number
  }

  /**
   * Ensure void elements are "self-closing".
   *
   * @param {string} html The HTML string to evaluate.
   * @returns An HTML string where void elements are formatted as self-closing.
   * @example <br> => <br />
   */
  export function closify(html: string): string

  /**
   * Enforcement entity characters for textarea content.
   * By default, this also does basic minification before setting entities.
   * For full minification, pass `minify_content` as `true`.
   * 
   * @param {string} html
   * @param {boolean} [minify] Fully minifies the content of textarea elements. 
   * Defaults to `false`. We recommend a value of `true` if you're running `entify()` 
   * as a standalone function.
   * @returns An HTML string where entities are enforced on the contents of textareas.
   * @example <textarea>3 > 2</textarea> => <textarea>3 &gt; 2</textarea>
   */
  export function entify(html: string, minify?: boolean): string

  /**
   * Creates a single-line HTML string
   * by removing line returns, tabs, and relevant spaces.
   * 
   * @param html The HTML string to minify.
   * @returns A minified HTML string.
   */
  export function minify(html: string): string

  /**
   * Format HTML with line returns and indentations.
   * 
   * @param html The HTML string to prettify.
   * @param config A configuration object.
   * @returns A well-formed HTML string.
   */
  export function prettify(html: string, config?: Config): string
}
