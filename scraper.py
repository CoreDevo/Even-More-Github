import urllib
import json
from decimal import Decimal
from bs4 import BeautifulSoup
from mechanize import Browser

br = Browser()
br.set_handle_robots(False)
br.set_handle_referer(False)
br.set_handle_refresh(False)

username = 'ckyue'
repoLink = 'https://github.com/' + username+ '?tab=repositories'

br.addheaders = [('User-agent', 'Firefox')]
br.open(repoLink)

soup = BeautifulSoup(br.response().read())
languages = []
counter = 10
while (counter > 0):
    languages.append(soup.findAll("span", {"itemprop" : "programmingLanguage"})[10-counter])
    counter = counter - 1
# print soup.prettify()[0:1000000]

# with open(outputfilename, 'wb') as outfile:
#     json.dump(skills, outfile)

print languages[0:10]
# print json.dumps(languages, ensure_ascii=False)
