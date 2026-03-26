<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 每个页面公共css */
page {
  background-color: #121212;
  color: #E8E0D0;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

view, text, button {
  box-sizing: border-box;
}

button::after {
  border: none;
}

.premium-press {
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.premium-press:active {
  transform: scale(0.96);
  opacity: 0.8;
}
</style>
