out_file=$1
out_file=${out_file:-release-notes.md}

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"   
    printf '%s' "$var"
}

echo "### New commits since last release:" >> $out_file
readarray -t tags <<< $(git tag -l --sort=-version:refname)
commits=$(git log --pretty=format:"%s&&&%b;;;" ${tags[1]}..${tags[0]}^)

commit_with_body_template=$(cat << END
<details>
  <summary>%s</summary>

  %s
</details>\n\n
END
)

while [[ $commits ]]; do
  commit=${commits%%;;;*};
  subject=$(trim ${commit%&&&*});
  body=$(trim ${commit#*&&&});
  if [[ $body ]]; then
    printf "%s $commit_with_body_template" "-" "$subject" "$body" >> $out_file;
  else
    printf "%s $subject\n" "-" >> $out_file;
  fi

  commits=${commits#*;;;};
done;