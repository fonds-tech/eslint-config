<template>
  <ul>
    <li v-for="item in items">
      {{ item }}
    </li>
  </ul>
  <img src="avatar.png">
</template>

<script setup>
const items = ["Vue", "Lint"];
const unused = items.length;
</script>
