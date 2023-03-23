previous_user_input = ""
last_ai_output = ""

while True:
  # get user input
  user_input = input("New prompt:\n").strip()

  if (user_input == "q"):
    break

  if (user_input == ""):
    if (previous_user_input != ""):
      user_input = previous_user_input.strip() + " " + last_ai_output.strip()
    else:
      continue

  print("Query to model is:", repr(user_input))
    
  previous_user_input = user_input

  last_ai_output = "foo bar"
