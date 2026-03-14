<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})
</script>

<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<style scoped>
.markdown-body {
  word-break: break-word;
  color: #ececec;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  color: #ffffff;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

.markdown-body :deep(h1) { font-size: 1.5rem; }
.markdown-body :deep(h2) { font-size: 1.35rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.4rem; }
.markdown-body :deep(h3) { font-size: 1.2rem; }
.markdown-body :deep(h4) { font-size: 1.1rem; }

.markdown-body :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-body :deep(ul) {
  list-style-type: disc;
}

.markdown-body :deep(ol) {
  list-style-type: decimal;
}

.markdown-body :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-body :deep(li > ul),
.markdown-body :deep(li > ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
  color: #f8f8f2;
}

.markdown-body :deep(pre) {
  background-color: #1e1e1e;
  padding: 1rem;
  border-radius: 12px;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.85rem;
  display: block;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid rgba(255, 255, 255, 0.2);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: #b4b4b4;
  font-style: italic;
}

.markdown-body :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 2rem 0;
}

.markdown-body :deep(strong) {
  color: #ffffff;
  font-weight: 600;
}

.markdown-body :deep(a) {
  color: #4f46e5;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  text-align: left;
}

.markdown-body :deep(th) {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
}
</style>
