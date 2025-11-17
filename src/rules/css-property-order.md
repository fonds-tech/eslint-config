# CSS 属性排序规则 - css-property-order

## 规则说明

该规则用于按长度对 CSS/LESS/SCSS 代码中的属性进行排序，从短到长，提高代码的一致性和可读性。

## 功能特性

- ✅ 自动按属性长度排序（从短到长）
- ✅ 支持 CSS、LESS、SCSS 预处理器
- ✅ 支持忽略特定属性名称
- ✅ 支持保留属性间的注释
- ✅ 支持 CSS 自定义属性（变量）

## 排序优先级

1. **保留顺序**：在 `ignoreProperties` 列表中的属性保持原有位置
2. **长度排序**：其他属性按长度从短到长排序
3. **属性名长度**：当多个属性值长度相同时，按属性名长度排序

## 配置选项

### sortByLength

- **类型**：`boolean`
- **默认值**：`true`
- **说明**：是否按长度排序属性。设为 `false` 时不对属性进行排序。

### ignoreProperties

- **类型**：`string[]`
- **默认值**：`[]`
- **说明**：要忽略排序的属性名称列表。这些属性将保持在原有位置。

### preserveComments

- **类型**：`boolean`
- **默认值**：`true`
- **说明**：排序时是否保留属性之间的注释。

## 使用示例

### 基本使用

```json
{
  "rules": {
    "@senran/css-property-order": "warn"
  }
}
```

### 自定义配置

```json
{
  "rules": {
    "@senran/css-property-order": [
      "warn",
      {
        "sortByLength": true,
        "ignoreProperties": ["content", "position"],
        "preserveComments": true
      }
    ]
  }
}
```

## 示例对比

### ❌ 错误示例

```css
.container {
  background-color: #f5f5f5;
  margin: 0;
  padding: 20px;
  border-radius: 8px;
  color: #333;
  z-index: 10;
  opacity: 0.8;
}
```

### ✅ 正确示例

```css
.container {
  margin: 0;
  color: #333;
  opacity: 0.8;
  z-index: 10;
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f5f5;
}
```

## LESS/SCSS 示例

### LESS

```less
.card {
  width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 16px;
  background: @white;

  // 排序后
  padding: 16px;
  background: @white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 300px;
}
```

### SCSS

```scss
.button {
  background-color: $primary-color;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid darken($primary-color, 10%);
  border-radius: 4px;
  padding: 8px 16px;

  // 排序后
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  border: 1px solid darken($primary-color, 10%);
  background-color: $primary-color;
}
```

## 注意事项

1. **嵌套规则**：对于 LESS/SCSS 中的嵌套规则，每个规则块会单独排序
2. **At-rules**：`@media`、`@keyframes` 等规则块会被分别处理
3. **自定义属性**：CSS 自定义属性（如 `--my-color`）按标准属性处理
4. **浏览器前缀**：带前缀的属性（如 `-webkit-transform`）会按完整名称计算长度

## 相关规则

- [`sort-keys`](https://github.com/eslint/eslint/blob/main/docs/rules/sort-keys.md) - 排序对象键
- [`perfectionist/sort-*`](https://perfectionist.dev/) - 完美主义者排序规则集

## 参考资源

- [MDN - CSS 属性参考](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)
- [LESS 文档](http://lesscss.org/)
- [SCSS 文档](https://sass-lang.com/)
