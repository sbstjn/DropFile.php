<?php

if (isset($_FILES['file'])) {
  $path = dirname(__FILE__) . '/' . date('Y');
  if (!file_exists($path)) {
    mkdir($path); }
  $path = $path . '/' . date('m');
  if (!file_exists($path)) {
    mkdir($path); }
  $path = $path . '/';
  
  list($name, $ext) = explode('.', $_FILES['file']['name']);
  $name = $name . '.' . substr(md5(time() . rand(0, 100)), 0, 8) . '.' . $ext;

  $name = $path . $name;
  if (move_uploaded_file($_FILES['file']['tmp_name'], $name)) {
    echo '{"success": true, "file": "' . str_replace(dirname(__FILE__), '', $name) . '"}';
  } else {
    echo '{"success": false}';
  }
}

exit;