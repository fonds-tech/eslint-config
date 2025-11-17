<script>
  const input = "<strong>alert</strong>";
  const count = 0;
  $: literal = 1;
</script>

<p>{count + literal}</p>
{@html input}
