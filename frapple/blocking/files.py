
import datetime

import tornado.template

from csftool.blocking.files import CsfToolBlockingFileHandler
from csftool.blocking.files import CsfToolBlockingImageFileHandler

from frapple.blocking.handler import AppleFrostBlockingRequestHandler
from frapple.blocking.handler import AppleFrostVarietyRequestHandler

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

TOOL_FILE_HANDLERS = { 'file' : CsfToolBlockingFileHandler,
                       'icon' : CsfToolBlockingImageFileHandler,
                       'image' : CsfToolBlockingImageFileHandler,
                       'toolinit.js': CsfToolBlockingFileHandler,
                     }

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class TemplateHandlerMethods:

    def __call__(self, request):
        if self.debug:
            print '\nAppleFrostTemplateHandlerMethods'
            print "    processing request for", request.uri

        resource_path = self.getResourcePath(request.uri)
        if self.debug: print 'resource path', resource_path

        with open(resource_path, 'r') as _file_:
            template = tornado.template.Template(_file_.read())

        request_dict = self.requestAsDict(request)
        parameters = self.extractTemplateParameters(request_dict)
        content = template.generate(csf_server_url=self.getHostUrl(request),
                                    **parameters)

        content = content.replace('&quot;','"').replace("&#39;","'")
        request.write(self.constructResponse(content))
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractTemplateParameters(self, request_dict):
        return self.extractServerParameters(request_dict)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractServerParameters(self, request_dict):
        server_url = self.server_config.server_url
        params = { 'server_url':server_url, }
        if 'tool_url' in self.server_config:
            params['tool_url'] = self.server_config.tool_url
        if 'csftool_url' in self.server_config:
            params['csftool_url'] = self.server_config.csftool_url
        else: params['csftool_url'] = "%s/csftool"  % server_url
        return params


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingTemplateHandler(TemplateHandlerMethods,
                                        AppleFrostBlockingRequestHandler):
    """ add contents of a file to the response.
    Primarily used for accessing local css and javascript files.
    """

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_FILE_HANDLERS['/'] = AppleFrostBlockingTemplateHandler
TOOL_FILE_HANDLERS['page'] = AppleFrostBlockingTemplateHandler
TOOL_FILE_HANDLERS['template'] = AppleFrostBlockingTemplateHandler

TOOL_FILE_HANDLERS['wpdev-frapple.html'] = \
                    AppleFrostBlockingTemplateHandler
TOOL_FILE_HANDLERS['load-dependencies.js'] = \
                    AppleFrostBlockingTemplateHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingInitHandler(TemplateHandlerMethods,
                                    AppleFrostVarietyRequestHandler):
    """ Assemble configuration parameters for the tool initialization script.
    """

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractTemplateParameters(self, request_dict):
        today = datetime.date.today()

        # server access parameters from request dict
        parameters = self.extractServerParameters(request_dict)
        # season limit parameters from request dict
        parameters.update(self.extractSeasonDates(request_dict))

        # template-specific view/date parameters
        parameters['days_in_view'] = days_in_view = self.tool.days_in_view
        days_before_doi = datetime.timedelta(days=days_in_view/2)

        season_end_day = list(self.tool.season_end_day)
        parameters['season_end_day'] = season_end_day

        season_start_day = list(self.tool.season_start_day)
        parameters['season_start_day'] = season_start_day

        season = parameters['season']
        description = self.tool.season_description
        parameters['season_description'] = \
            description % {'start_year':season-1, 'end_year':season }

        # default date of interest
        default_doi = self.tool.get('default_doi', None)
        if default_doi is None:
            #forecast_days = 6
            #max_possible_date = today + datetime.timedelta(days=forecast_days)
            #default_doi = max_possible_date - days_before_doi
            default_doi = today
        elif isinstance(default_doi, (list,tuple)):
            if default_doi[0] < season_end_day[0]:
                default_doi = self.dayToSeasonDate(season, default_doi)
            else: default_doi = self.dayToSeasonDate(season-1, default_doi)

        if default_doi > today:
            default_doi = today
            #default_doi = max(self.stringToDate(parameters['season_start']), 
            #                  (today - days_before_doi))

        season_end = self.stringToDate(parameters['season_end'])
        if default_doi > season_end \
        or days_in_view > ((season_end - default_doi).days + 1):
            default_doi = season_end - days_before_doi

        default_doi = self.appDateFormat(default_doi)
        parameters['default_doi'] = default_doi 

        # make sure there is an doi selected for initial requests
        if not 'doi' in parameters: parameters['doi'] = default_doi

        # add viriety deafults
        parameters['default_variety'] = self.tool.default_variety
        parameters['varieties_js'] = self.tool.varieties_js

        # add location parameters
        loc_key = self.tool.default_location
        location = self.tool.locations[loc_key]
        parameters['loc_lat'] = location.lat
        parameters['loc_lng'] = location.lon
        parameters['loc_key'] = location.name
        parameters['loc_address'] = location.address
        parameters['locations_js'] = self.tool.locations_js

        # prameters specific to toolint.js script initialization
        parameters['button_labels'] = self.tool.button_labels
        parameters['chart_labels'] = self.tool.chart_labels
        parameters['chart_types'] = self.tool.chart_types
        parameters['default_chart'] = self.tool.default_chart
        parameters['server_url'] = self.server_config.server_url
        parameters['stage_labels'] = self.tool.stage_labels
        parameters['toolname'] = self.toolname

        return parameters

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_FILE_HANDLERS['tool'] = AppleFrostBlockingInitHandler
TOOL_FILE_HANDLERS['tool-no-log'] = AppleFrostBlockingInitHandler
TOOL_FILE_HANDLERS['tool.js'] = AppleFrostBlockingInitHandler
TOOL_FILE_HANDLERS['tool-no-log.js'] = AppleFrostBlockingInitHandler
#TOOL_FILE_HANDLERS['toolinit.js'] = AppleFrostBlockingInitHandler

