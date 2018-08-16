#! /usr/bin/env python

import os, sys
import datetime

from frapple.blocking.data import TOOL_DATA_HANDLERS

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('-v', dest='variety', default=None)
parser.add_option('-z', action='store_true', dest='debug', default=False)
options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
variety = options.variety

from frapple.config import CONFIG
server_config = CONFIG.copy()
del CONFIG

location_key = server_config.tool.default_location
request_type = args[0]
season = datetime.date.today().year
if len(args) == 2:
    if args[1].isdigit(): season = int(args[1])
    else: location_key = args[1]
elif len(args) == 3:
     season = int(args[1])
     location_key = args[2]

server_config.mode = 'dev'
server_config.update(server_config.modes.dev.attrs)
server_config.dirpaths = server_config.modes.dev.dirpaths.attrs
server_config.resources = { 'something':'somewhere',
                            'something_else':'somewhere_else', }

location = server_config.tool.locations[location_key].attrs
location['key'] = location_key
if variety is None:
    location['variety'] = server_config.tool.default_variety
else: location['variety'] = variety
location['doi'] = ('%d-%%02d-%%02d' % season) % server_config.tool.default_doi

# create a request handler
HandlerClass = TOOL_DATA_HANDLERS[request_type]
handler = HandlerClass(server_config)

# replace requestAsDict function with one that passes the input dict though
def requestAsdict(request):
    return request
handler.requestAsDict = requestAsdict

# replace respondWithJSON function with one that passes the response thru
def respondWithJSON(request, response_json):
    print '\nresponse\n', response_json
handler.respondWithJSON = respondWithJSON

# construct the request ... 2 main components : season dates and location
request = dict(zip(['season','season_start','season_end'],
                   handler.seasonDates(season)))
request['location'] = location

# run request though the handler
handler(request)

