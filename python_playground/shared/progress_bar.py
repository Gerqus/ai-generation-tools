from colorama import Fore, Back, Style

def print_percent_done(index, total, bar_len=50, title='Please wait'):
  '''
  index is expected to be 0 based index. 
  0 <= index < total
  '''
  percent_done = (index+1)/total*100
  percent_done = round(percent_done, 1)

  done = round(percent_done/(100/bar_len))
  togo = bar_len-done

  done_str = '█'*int(done)
  togo_str = '░'*int(togo)

  print(f'  ⏳{title}: [{done_str}{togo_str}] {percent_done}% {(Fore.GREEN + Style.BRIGHT + "done" + Style.RESET_ALL) if togo == 0 else ""}', end='\r')

  if round(percent_done) == 100:
    print('  ✅')
