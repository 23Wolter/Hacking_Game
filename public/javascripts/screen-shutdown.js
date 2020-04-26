var $tv = $('.tv')
  ,$screen = $('.screen-content')
  ,$btn = $('.js-shtd-btn')
  ,videoHtml = '<iframe src="//player.vimeo.com/video/25323516?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1" width="590" height="330" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';

$btn.on('click', function(){
  if ($tv.hasClass('_off')) {
    $tv.removeClass('_off');
    $screen.html(videoHtml)
  } else {
    $tv.addClass('_off');
    $screen.empty();
  }
})