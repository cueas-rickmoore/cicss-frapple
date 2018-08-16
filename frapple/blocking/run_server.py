#!/usr/bin/env python

import os, sys
import socket
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.server  import CsfToolBlockingHttpServer
from csftool.utils import validateResourceConfiguration
from csftool.blocking.request import CsfToolBlockingRequestManager

# from frapple.blocking.request import AppleFrostBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


from frapple.blocking.data import TOOL_DATA_HANDLERS
from frapple.blocking.files import TOOL_FILE_HANDLERS

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('--demo', action='store_true', default=False, dest='run_as_demo')
parser.add_option('--local', action='store_true', default=False, dest='localhost')
parser.add_option('--log', action='store', type='string', default=None,
                  dest='log_filepath')
parser.add_option('--page', action='store', type='string', default=None,
                  dest='tool_page')
parser.add_option('--pkg', action='store', type='string', default=None,
                  dest='pkg_dirpath')
parser.add_option('--date_of_interest', action='store', type='string', default=None,
                  dest='date_of_interest')
parser.add_option('--port', action='store', type='int', default=None,
                  dest='server_port')
parser.add_option('--region', action='store', type='string', default=None,
                  dest='region_key')
parser.add_option('--source', action='store', type='string', default=None,
                  dest='source_key')
parser.add_option('--tool', action='store', type='string', default=None,
                  dest='toolname')

parser.add_option('-c', action='store_true', default=False, dest='csftool')
parser.add_option('-d', action='store_true', default=False, dest='dev_mode')
parser.add_option('-p', action='store_true', default=False, dest='prod_mode')
parser.add_option('-t', action='store_true', default=False, dest='test_mode')
parser.add_option('-w', action='store_true', default=False, dest='wpdev_mode')

parser.add_option('-v', action='store_true', default=False, dest='verbose')
parser.add_option('-z', action='store_true', default=False, dest='debug')
options, args = parser.parse_args()

debug = options.debug
verbose = options.verbose

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# allow for specialized alternate tool configurations
if options.prod_mode: mode = "prod"
elif options.test_mode: mode = "test"
elif options.wpdev_mode: mode = "wpdev"
else: mode = "dev"
include_csftool = mode in ("dev", "test", "wpdev") or options.csftool

# import the default GDD server configuration
from frapple.config import CONFIG as TOOL_CONFIG
server_config = TOOL_CONFIG.copy()
# don't drag the tool config around
del TOOL_CONFIG

server_config.mode = mode
mode_config = server_config.modes[mode]
server_config.update(mode_config.attrs)
server_config.dirpaths = mode_config.dirpaths.attrs
if (mode == "test" and options.dev_mode):
    print "BOTH TEST & DEV MODES"
    server_config.dirpaths.resources = server_config.modes.dev.dirpaths.resources
    print server_config.dirpaths.resources
# validate the resources and get full path to each
server_config.resources = \
    { 'frapple': validateResourceConfiguration(server_config), }

if options.run_as_demo:
    server_config.dates = server_config.demo.dates.copy('dates')
    server_config.season = server_config.demo.season

# look for a config overrides file
cfgfile = None
if 'CSF_FRAPPLE_CONFIG_PY' in os.environ:
    cfgfile = open(os.environ['CSF_FRAPPLE_CONFIG_PY'],'r')
else:
    dirpath = os.path.split(os.path.abspath(__file__))[0]
    filepath = os.path.join(dirpath, 'server_config.py')
    if os.path.exists(filepath):
        cfgfile = open(filepath,'r')
if cfgfile is not None:
    overrides = eval(cfgfile.read())
    cfgfile.close()
    server_config.update(overrides)

# apply overrides from command line
if options.source_key is not None:
    server_config.tool.data_source_key = options.source_key

if options.region_key is not None:
    server_config.tool.data_region_key = options.region_key

if options.pkg_dirpath is not None:
    server_config.dirpaths.package = os.path.abspath(options.pkg_dirpath)

date_of_interest = options.date_of_interest
if date_of_interest is not None:
    server_config.tool.default_doi = date_of_interest

# default location and JS object containing all locations
locations = [ ]
for key, loc in server_config.tool.locations.items():
    location_js = '%s:{doi:null' % key
    if 'variety' in loc:
        location_js = '%s,variety:"%s"' % (location_js, loc.variety)
    else: location_js = '%s,variety:null' % location_js
    location_js = '%s,lat:%.6f,lng:%.6f' % (location_js, loc.lat, loc.lon)
    locations.append('%s,address:"%s"}' % (location_js, loc.address))
server_config.tool.locations_js = '{%s}' % ','.join(locations)

# default variety and JS object containing all varieties
varieties = { }
varieties_js = [ ]
for key in server_config.tool.varieties:
    description = server_config.tool.varieties[key].description
    varieties[key] = description
    varieties_js.append('%s:"%s"' % (key,description))
server_config.tool.varieties = varieties
server_config.tool.varieties_js = '{%s}' % ','.join(varieties_js)

if options.toolname is not None:
    toolname = options.toolname
else: toolname = server_config.tool.toolname 
server_config.toolname = toolname

if options.tool_page is None:
    tool_page = server_config.get('home', None)
else: tool_page = options.tool_page

if tool_page is not None:
    abspath = os.path.abspath(tool_page)
    if not os.path.exists(abspath):
        resource_path = server_config.dirpaths.resources
        tool_page = os.path.join(resource_path, 'pages', tool_page)
        if not os.path.exists(tool_page):
            raise IOError, 'invalid file path for home page : %s' % tool_page
    else: tool_page = abspath 
    # create a new resources entry in the server config
    server_config.resources.frapple['/'] = ('page', 'file', tool_page)

if options.log_filepath is not None:
    import logging
    log_filepath = os.path.abspath(options.log_filepath)
    app_logger = logging.getLogger("tornado.application")
    app_logger.addHandler(logging.FileHandler(log_filepath))


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# track the pid for use by rc.d script
if len(args) > 0:
    pid_filepath = os.path.abspath(args[0])
    pid_file = open(pid_filepath, 'w')
    pid_file.write('%d' % os.getpid())
    pid_file.close()

server_config.debug = debug
server_config.verbose = verbose

# import the CSF tool configuration
if include_csftool:
    from csftool.config import CONFIG as CSFTOOL_CONFIG
    csftool_config = CSFTOOL_CONFIG.copy()
    del CSFTOOL_CONFIG
    # validate the resources and get full path to each
    dirpath = server_config.dirpaths.resources.replace('frapple','csftool')
    csftool_config.dirpaths.resources = \
        dirpath.replace('tool_pkg','csftool_pkg').replace('apple','csftool')
    server_config.resources.csftool = \
        validateResourceConfiguration(csftool_config)
    del csftool_config

# create a request manager
#request_manager =  AppleFrostBlockingRequestManager(server_config)
request_manager =  CsfToolBlockingRequestManager(server_config)
request_manager.registerResponseHandlerClasses(toolname, **TOOL_FILE_HANDLERS)
request_manager.registerResponseHandlerClasses(toolname, **TOOL_DATA_HANDLERS)
if include_csftool:
    from csftool.blocking.files import CSFTOOL_FILE_HANDLERS
    request_manager.registerResponseHandlerClasses('csftool',
                                                   **CSFTOOL_FILE_HANDLERS)
if debug:
    if include_csftool:
        print '\n\nresponse_handlers[csftool]'
        for key, value in request_manager.response_handlers['csftool'].items():
            print '    ', key, '=', value
    print '\n\nresponse_handlers[frapple]'
    for key, value in request_manager.response_handlers['frapple'].items():
        print '    ', key, '=', value
    print '\n\n'

# create an HTTP server
http_server = CsfToolBlockingHttpServer(server_config, request_manager)
# run the server
http_server.run()

